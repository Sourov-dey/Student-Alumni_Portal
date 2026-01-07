// frontend/src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import GoogleSignIn from '../components/GoogleSignIn';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const UNI_DOMAIN = 'aus.ac.in';
  const isUniEmail = (addr) => addr && addr.toLowerCase().endsWith(`@${UNI_DOMAIN}`);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.email || !isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await http.post('/api/auth/signup', {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role
      });

      const { token, user } = response.data;
      
      if (!token || !user) {
        setError('Registration failed. Please try again.');
        return;
      }

      // Log the user in
      login(token, user);

      // Check if verification is needed
      if (!isUniEmail(formData.email) && !user.verified) {
        navigate('/verify-id');
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 520, 
      padding: 20, 
      margin: '60px auto',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 8, color: '#1f2937' }}>
        Create Account
      </h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24, fontSize: '0.9em' }}>
        Join the Assam University Alumni Network
      </p>

     

      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 6, 
            fontWeight: 500, 
            color: '#374151',
            fontSize: '0.9em'
          }}>
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            autoComplete="name"
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

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 6, 
            fontWeight: 500, 
            color: '#374151',
            fontSize: '0.9em'
          }}>
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            autoComplete="email"
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
          {isValidEmail(formData.email) && !isUniEmail(formData.email) && (
            <div style={{ 
              marginTop: 6, 
              color: '#f59e0b', 
              fontSize: '0.85em',
              display: 'flex',
              alignItems: 'start',
              gap: 4
            }}>
            </div>
          )}
        </div>

        {/* Role */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 6, 
            fontWeight: 500, 
            color: '#374151',
            fontSize: '0.9em'
          }}>
            I am a *
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: 6, 
              border: '1px solid #d1d5db',
              fontSize: '0.95em',
              outline: 'none',
              background: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          >
            <option value="student">Current Student</option>
            <option value="alumni">Alumni</option>
          </select>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 6, 
            fontWeight: 500, 
            color: '#374151',
            fontSize: '0.9em'
          }}>
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a strong password"
            autoComplete="new-password"
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
          <div style={{ marginTop: 6, color: '#6b7280', fontSize: '0.8em' }}>
            Minimum 6 characters
          </div>
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 6, 
            fontWeight: 500, 
            color: '#374151',
            fontSize: '0.9em'
          }}>
            Confirm Password *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            autoComplete="new-password"
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
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Login Link */}
      <div style={{ 
        marginTop: 24, 
        textAlign: 'center', 
        color: '#6b7280',
        fontSize: '0.9em'
      }}>
        Already have an account?{' '}
        <Link 
          to="/login" 
          style={{ 
            color: '#2563eb', 
            textDecoration: 'none',
            fontWeight: 500
          }}
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}