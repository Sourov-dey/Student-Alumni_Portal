import React, { useState } from 'react';
import http from '../api/http';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignIn from '../components/GoogleSignIn';

export default function Login() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');

  const { login } = useAuth();
  const nav = useNavigate();

  const isValidEmail = (e) => /\S+@\S+\.\S+/.test(e);
  const UNI_DOMAIN = 'aus.ac.in';
  const isUniEmail = (addr) => {
    if (!addr) return false;
    return addr.toLowerCase().endsWith(`@${UNI_DOMAIN}`);
  };

  // Request verification code
  const sendCode = async () => {
    setError('');
    setInfoMsg('');
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    try {
      setCodeSending(true);
      await http.post('/api/auth/request-code', { email: email.trim() });
      setCodeRequested(true);
      if (isUniEmail(email)) {
        setInfoMsg('Code sent — check your Assam University email. It expires in 10 minutes.');
      } else {
        setInfoMsg('Code sent — check your email. You will need to verify your identity after login.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send code');
    } finally {
      setCodeSending(false);
    }
  };

  // Verify code and log in
  const verify = async () => {
    setError('');
    if (!code || code.trim().length === 0) return setError('Please enter the code');
    try {
      setVerifying(true);
      const res = await http.post('/api/auth/verify-code', {
        email: email.trim(),
        code: code.trim(),
        role: role.toLowerCase(),
        name: name.trim()
      });
      const { token, user } = res.data || {};
      if (!token || !user) {
        setError('Verification failed');
        setVerifying(false);
        return;
      }
      
      login(token, user);
      
      // If non-university email and verification required, redirect to ID verification
      if (!isUniEmail(email) && !user.isVerified) {
        nav('/verify-id');
      } else {
        nav('/jobs');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, padding: 20, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Sign In</h2>

      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ marginBottom: 16 }}>
          <div id="gsi-button"></div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          margin: '16px 0',
          color: '#666',
          fontSize: '0.9em'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
          <div>or</div>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Email address</label>
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); setInfoMsg(''); }}
            placeholder="Enter your email address"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
          />
          {isValidEmail(email) && !codeRequested && (
            <div style={{ marginTop: 8, color: '#666', fontSize: '0.9em' }}>
              We will send a verification code to your registered email address
               {/* {isUniEmail(email) ? 
                'We will send a verification code to your Assam University email.' :
                'We will send a verification code to your email. After verification, you will need to verify your identity by uploading an ID card.'
              }  */}
            </div>
          )}
        </div>

        {!codeRequested ? (
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
              >
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>

            <button 
              type="button" 
              onClick={sendCode} 
              disabled={codeSending || !isValidEmail(email) || !name.trim()} 
              style={{ 
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                background: codeSending || !isValidEmail(email) || !name.trim() ? '#9fbfe6' : '#0b63b7',
                color: '#fff',
                border: 'none',
                marginTop: 35,
                cursor: codeSending || !isValidEmail(email) || !name.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              {codeSending ? 'Sending verification code...' : 'Send verification code'}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Verification Code</label>
            <input 
              type="text"
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              placeholder="Enter the 6-digit code"
              style={{ 
                width: '100%', 
                padding: 8, 
                borderRadius: 6, 
                border: '1px solid #ddd', 
                marginBottom: 12 
              }} 
            />
            <button
              type="button"
              onClick={verify}
              disabled={verifying || !code}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                background: verifying || !code ? '#9fbfe6' : '#0b63b7',
                color: '#fff',
                border: 'none',
                cursor: verifying || !code ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              {verifying ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ color: '#d32f2f', marginTop: 12, fontSize: '0.9em', textAlign: 'center' }}>{error}</div>
        )}
        {infoMsg && (
          <div style={{ color: '#388e3c', marginTop: 12, fontSize: '0.9em', textAlign: 'center', padding: '12px', background: '#f1f8f1', borderRadius: 6 }}>{infoMsg}</div>
        )}
      </form>
    </div>
  );
}